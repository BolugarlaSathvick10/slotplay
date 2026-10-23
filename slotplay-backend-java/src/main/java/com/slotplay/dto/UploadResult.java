package com.slotplay.dto;

public class UploadResult {

    private String url;
    private String key;
    private String mimeType;
    private long sizeBytes;

    public UploadResult() {
    }

    public UploadResult(String url, String key, String mimeType, long sizeBytes) {
        this.url = url;
        this.key = key;
        this.mimeType = mimeType;
        this.sizeBytes = sizeBytes;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }
}
