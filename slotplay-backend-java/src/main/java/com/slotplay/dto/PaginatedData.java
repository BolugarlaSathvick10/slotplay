package com.slotplay.dto;

import java.util.List;

public class PaginatedData<T> {

    private List<T> data;
    private int page;
    private int limit;
    private long total;
    private int pages;

    public PaginatedData() {
    }

    public PaginatedData(List<T> data, int page, int limit, long total, int pages) {
        this.data = data;
        this.page = page;
        this.limit = limit;
        this.total = total;
        this.pages = pages;
    }

    public List<T> getData() {
        return data;
    }

    public void setData(List<T> data) {
        this.data = data;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getLimit() {
        return limit;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public int getPages() {
        return pages;
    }

    public void setPages(int pages) {
        this.pages = pages;
    }

    public PaginationInfo getPagination() {
        return new PaginationInfo(page, limit, total, pages);
    }

    public static class PaginationInfo {
        private int page;
        private int limit;
        private long total;
        private int pages;

        public PaginationInfo() {
        }

        public PaginationInfo(int page, int limit, long total, int pages) {
            this.page = page;
            this.limit = limit;
            this.total = total;
            this.pages = pages;
        }

        public int getPage() {
            return page;
        }

        public void setPage(int page) {
            this.page = page;
        }

        public int getLimit() {
            return limit;
        }

        public void setLimit(int limit) {
            this.limit = limit;
        }

        public long getTotal() {
            return total;
        }

        public void setTotal(long total) {
            this.total = total;
        }

        public int getPages() {
            return pages;
        }

        public void setPages(int pages) {
            this.pages = pages;
        }
    }
}
