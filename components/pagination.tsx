import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

export function paginate<T>(items: T[], page: number) {
  const start = (page - 1) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

export function Pagination({
  currentPage,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const pages = pageNumbers(currentPage, totalPages);

  function changePage(page: number) {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <nav className="pagination" aria-label="一覧ページ">
      <button
        aria-label="前のページ"
        disabled={currentPage === 1}
        onClick={() => changePage(currentPage - 1)}
        type="button"
      >
        <ChevronLeft size={17} />
        <span>前へ</span>
      </button>
      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span className="pagination-ellipsis" key={`ellipsis-${index}`}>…</span>
        ) : (
          <button
            aria-current={page === currentPage ? "page" : undefined}
            className={page === currentPage ? "active" : ""}
            key={page}
            onClick={() => changePage(page)}
            type="button"
          >
            {page}
          </button>
        ),
      )}
      <button
        aria-label="次のページ"
        disabled={currentPage === totalPages}
        onClick={() => changePage(currentPage + 1)}
        type="button"
      >
        <span>次へ</span>
        <ChevronRight size={17} />
      </button>
    </nav>
  );
}

function pageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("ellipsis");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push("ellipsis");
  pages.push(totalPages);

  return pages;
}
