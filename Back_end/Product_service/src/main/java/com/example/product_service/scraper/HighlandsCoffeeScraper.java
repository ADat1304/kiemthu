package com.example.product_service.scraper;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class HighlandsCoffeeScraper {

    // Các URL menu của Highlands
    private static final Map<String, List<String>> CATEGORY_URLS = Map.of(
            "Cà Phê", List.of("https://www.highlandscoffee.com.vn/vn/ca-phe.html"),
            "MENU NGUYÊN BẢN", List.of("https://www.highlandscoffee.com.vn/vn/menu-nguyen-ban.html"),
            "TINH HOA TRÀ HIGHLANDS", List.of("https://www.highlandscoffee.com.vn/vn/tinh-hoa-tra-highlands.html"),
            "DÒNG CÀ PHÊ ĐẶC BIỆT", List.of("https://www.highlandscoffee.com.vn/vn/dong-ca-phe-dac-biet.html"),
            "FREEZE", List.of("https://www.highlandscoffee.com.vn/vn/freeze.html"),
            "TRÀ", List.of("https://www.highlandscoffee.com.vn/vn/tra.html"),
            "KHÁC", List.of("https://www.highlandscoffee.com.vn/vn/khac.html")
    );

    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]+([.,][0-9]{3})*");

    public List<HighlandsProduct> scrapeMenu() throws IOException {
        List<HighlandsProduct> products = new ArrayList<>();
        // tránh trùng sản phẩm nếu xuất hiện ở nhiều layout
        List<String> seenProductNames = new ArrayList<>();

        for (Map.Entry<String, List<String>> categoryEntry : CATEGORY_URLS.entrySet()) {
            String rawCategory = categoryEntry.getKey();

            Document document = connectWithFallbacks(categoryEntry.getValue());
            if (document == null) {
                log.warn("Skipping category {} because all URLs failed", rawCategory);
                continue;
            }

            Elements productCards = locateProductCards(document);
            for (Element card : productCards) {
                String productName = extractProductName(card);
                if (productName.isBlank() || seenProductNames.contains(productName)) {
                    continue;
                }

                BigDecimal price = extractPrice(card);
                String imageUrl = extractImage(card);

                // nếu thiếu giá / ảnh thì vào trang chi tiết
                if (price.equals(BigDecimal.ZERO) || imageUrl.isBlank()) {
                    HighlandsProduct details = fetchFromDetailPage(card, rawCategory, productName);
                    if (details != null) {
                        price = details.price();
                        imageUrl = details.imageUrl();
                    }
                }

                products.add(new HighlandsProduct(
                        rawCategory,   // category gốc, phân loại chi tiết sẽ xử lý ở ProductService
                        productName,
                        price,
                        imageUrl
                ));
                seenProductNames.add(productName);
            }
        }

        return products;
    }

    // ================= HTTP =================

    private Document connect(String url) throws IOException {
        Connection.Response response = Jsoup.connect(url)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36")
                .referrer("https://www.google.com/")
                .header("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
                .header("accept-language", "vi,en-US;q=0.9,en;q=0.8")
                .header("cache-control", "no-cache")
                .header("pragma", "no-cache")
                .ignoreContentType(true)
                .ignoreHttpErrors(true)
                .timeout(20000)
                .followRedirects(true)
                .execute();

        if (response.statusCode() >= 400) {
            throw new IOException("Failed to fetch Highlands Coffee menu, status " + response.statusCode());
        }

        return response.parse();
    }

    private Document connectWithFallbacks(List<String> urls) {
        for (String url : urls) {
            try {
                return connect(url);
            } catch (IOException ex) {
                log.warn("Failed to fetch Highlands category from {}: {}", url, ex.getMessage());
            }
        }
        return null;
    }

    // =============== PARSING HTML ===============

    private Elements locateProductCards(Document document) {
        Elements cards = document.select(
                ".product-item, li.product-item, .product-item-list .item, .product-list .item, " +
                        ".product, .product-card, .product-block, [data-product-id]");

        if (!cards.isEmpty()) {
            return cards;
        }

        Elements legacyCards = document.select(".item-product, .product-menu-item, .menu-item");
        if (!legacyCards.isEmpty()) {
            return legacyCards;
        }

        return document.select("article, .item");
    }

    private HighlandsProduct fetchFromDetailPage(Element card, String categoryName, String fallbackName) {
        Element linkElement = card.selectFirst("a[href]");
        if (linkElement == null) {
            return null;
        }

        String detailUrl = linkElement.absUrl("href");
        if (detailUrl.isBlank()) {
            return null;
        }

        try {
            Document detailPage = connect(detailUrl);
            String productName = extractDetailName(detailPage, fallbackName);
            BigDecimal price = extractPrice(detailPage);
            if (price.equals(BigDecimal.ZERO)) {
                price = extractPriceFromScripts(detailPage.html());
            }
            String imageUrl = extractDetailImage(detailPage);
            return new HighlandsProduct(categoryName, productName, price, imageUrl);
        } catch (Exception ex) {
            log.warn("Failed to fetch detail page for {}: {}", detailUrl, ex.getMessage());
            return null;
        }
    }

    private String extractProductName(Element card) {
        Element title = card.selectFirst(".product-name, .title, h3, h4, a[title]");
        if (title != null && !title.text().isBlank()) {
            return title.text().trim();
        }
        return card.text().trim();
    }

    private String extractDetailName(Document detailPage, String fallback) {
        Element title = detailPage.selectFirst("h1, .product-name, .product-detail-name, meta[property=og:title]");
        if (title != null) {
            String text = title.hasAttr("content") ? title.attr("content") : title.text();
            if (!text.isBlank()) {
                return text.trim();
            }
        }
        return fallback;
    }

    private BigDecimal extractPrice(Element card) {
        Element priceElement = card.selectFirst(
                ".price, .product-price, .prize, .gia, [itemprop=price], [data-price], [data-price-vnd]"
        );

        String priceText = "";

        if (priceElement != null) {
            if (priceElement.hasAttr("content")) {
                priceText = priceElement.attr("content");
            } else if (priceElement.hasAttr("data-price")) {
                priceText = priceElement.attr("data-price");
            } else if (priceElement.hasAttr("data-price-vnd")) {
                priceText = priceElement.attr("data-price-vnd");
            } else {
                priceText = priceElement.text();
            }
        }

        if (priceText.isBlank()) {
            priceText = card.attr("data-price");
        }

        if (priceText.isBlank()) {
            return BigDecimal.ZERO;
        }

        Matcher matcher = DIGIT_PATTERN.matcher(priceText.replace("\u00a0", " "));
        if (!matcher.find()) {
            return BigDecimal.ZERO;
        }
        String numeric = matcher.group().replace(".", "").replace(",", "");
        try {
            return new BigDecimal(numeric);
        } catch (NumberFormatException ex) {
            log.warn("Cannot parse price from text: {}", priceText);
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal extractPriceFromScripts(String html) {
        Matcher matcher = Pattern.compile("\\\"price\\\"\\s*:\\s*\\\"?([0-9.,]+)").matcher(html);
        if (matcher.find()) {
            String numeric = matcher.group(1).replace(".", "").replace(",", "");
            try {
                return new BigDecimal(numeric);
            } catch (NumberFormatException ignored) {
            }
        }
        return BigDecimal.ZERO;
    }

    private String extractImage(Element card) {
        Element image = card.selectFirst("img, picture source");
        if (image == null) {
            return "";
        }
        String imageUrl = image.hasAttr("data-src") ? image.absUrl("data-src")
                : image.hasAttr("data-lazy") ? image.absUrl("data-lazy")
                : image.hasAttr("srcset") ? image.absUrl("srcset")
                : image.absUrl("src");
        return imageUrl == null ? "" : imageUrl;
    }

    private String extractDetailImage(Document detailPage) {
        Element image = detailPage.selectFirst("meta[property=og:image], .product-image img, img[itemprop=image]");
        if (image == null) {
            return "";
        }
        String url = image.hasAttr("content") ? image.absUrl("content") : image.absUrl("src");
        return url == null ? "" : url;
    }
}
