import * as React from 'react';
import controlStyles from './FormControls.module.css';
import { Button } from './FormControls';

interface GenerateLabelsButtonProps {
  className?: string;
  onClick: () => void;
}

const GenerateLabelsButton: React.FC<GenerateLabelsButtonProps> = ({ className, onClick }) => (
  <Button aria-label="Generate Labels" className={className} onClick={onClick}>
    <span className={controlStyles.buttonLabel}>Generate Labels</span>
    <span className={controlStyles.buttonIcon} aria-hidden="true">⚡</span>
  </Button>
);

export default GenerateLabelsButton;