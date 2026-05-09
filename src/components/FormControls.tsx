import * as React from 'react';
import styles from './FormControls.module.scss';

const joinClasses = (...classNames: Array<string | undefined>): string => classNames.filter(Boolean).join(' ');

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ className, type = 'button', children, ...props }) => {
  return (
    <button {...props} type={type} className={joinClasses(styles.button, className)}>
      {children}
    </button>
  );
};

export type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement>;

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { className, ...props },
  ref,
) {
  return <input {...props} ref={ref} className={joinClasses(styles.input, className)} />;
});

export interface RadioOption {
  key: string;
  text: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  selectedKey: string;
  onChange: (key: string) => void;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({ name, options, selectedKey, onChange }) => {
  return (
    <div className={styles.radioGroup} role="radiogroup">
      {options.map((option) => {
        const inputId = `${name}-${option.key}`;

        return (
          <label key={option.key} htmlFor={inputId} className={styles.radioOption}>
            <input
              id={inputId}
              className={styles.radioInput}
              type="radio"
              name={name}
              checked={selectedKey === option.key}
              onChange={() => onChange(option.key)}
            />
            <span className={styles.radioLabel}>{option.text}</span>
          </label>
        );
      })}
    </div>
  );
};