import * as React from 'react';
import styles from './Pagination.module.css';
import { IPaginationProps } from '../models/IPaginationProps';

const Pagination = (props: IPaginationProps): React.ReactElement => {
  const { data, onPageChange, itemsPerPage = 35 } = props;
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const activePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  // Sync currentPage when totalPages changes (e.g., data shrinks, page count decreases).
  // Use functional setState to depend only on totalPages, avoiding redundant effect runs on every page click.
  React.useEffect(() => {
    setCurrentPage((prev) => (totalPages > 0 ? Math.min(prev, totalPages) : 1));
  }, [totalPages]);

  const lastReportedPage = React.useRef<number>(0);

  React.useEffect(() => {
    if (lastReportedPage.current !== activePage) {
      lastReportedPage.current = activePage;
      onPageChange(activePage);
    }
  }, [activePage, onPageChange]);

  const handleClick = (page: number): void => {
    setCurrentPage(page);
  };

  return (
    <nav className={styles.pagination} aria-label="Label pages">
      <span className={styles.pageLabel}>Pages:</span>
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={`page-${i + 1}`}
          onClick={() => handleClick(i + 1)}
          className={activePage === i + 1 ? styles.activePage : styles.pagenum}
          aria-label={`Go to page ${i + 1}`}
          aria-current={activePage === i + 1 ? 'page' : undefined}
        >
          {i + 1}
        </button>
      ))}
    </nav>
  );
};

export default Pagination;
