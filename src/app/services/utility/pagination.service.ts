export class Pagination<pag> {

    pageSize = 5;
    currentPage = 1;

    private items: pag[] = [];

    setItems(items: pag[]): void {
        this.items = items;
        this.ensureValidPage();
    }

    get totalItems(): number {
        return this.items.length;
    }

    get totalPages(): number {
        return Math.max(1,Math.ceil(this.totalItems / this.pageSize));
    }

    get pages(): number[] {
        return Array.from(
            { length: this.totalPages },
            (_, index) => index + 1
        );
    }

    get paginatedItems(): pag[] {
        const start =(this.currentPage - 1) * this.pageSize;
        return this.items.slice(start,start + this.pageSize);
    }

    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages) {return;}
        this.currentPage = page;
    }

    reset(): void {
        this.currentPage = 1;
    }

    private ensureValidPage(): void {
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        }
    }
}