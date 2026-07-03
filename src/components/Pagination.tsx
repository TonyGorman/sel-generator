import * as React from 'react';
import styles from './Pagination.module.css';
import { IPaginationProps } from '../models/IPaginationProps';

const Pagination = (props: IPaginationProps): React.ReactElement => {
  const { data, onPageChange, itemsPerPage = 35 } = props;
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handleClick = (number: number): void => setCurrentPage(number);

  React.useEffect(() => {
    const safePage = totalPages > 0 && currentPage > totalPages ? totalPages : currentPage;
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
      return;
    }

    const pageToRender = totalPages === 0 ? 1 : safePage;
    onPageChange(pageToRender);
  }, [currentPage, onPageChange, totalPages]);

  return (
    <nav className={styles.pagination} aria-label="Label pages">
      <span className={styles.pageLabel}>Pages:</span>
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={`page-${i + 1}`}
          onClick={() => handleClick(i + 1)}
          className={currentPage === i + 1 ? styles.activePage : styles.pagenum}
          aria-label={`Go to page ${i + 1}`}
          aria-current={currentPage === i + 1 ? 'page' : undefined}
        >
          {i + 1}
        </button>
      ))}
    </nav>
  );
};

export default Pagination;
