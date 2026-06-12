import * as React from 'react';
import styles from './FormControls.module.css';
import { MAX_SHELF_LETTER } from '../config/labelConfig';

const joinClasses = (...classNames: Array<string | undefined>): string => classNames.filter(Boolean).join(' ');

const setForwardedRef = <T,>(ref: React.ForwardedRef<T>, value: T | null): void => {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
};

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

type SharedTextFieldProps = {
  className?: string;
  multiline?: boolean;
  autoGrow?: boolean;
};

type SingleLineTextFieldProps = SharedTextFieldProps & React.InputHTMLAttributes<HTMLInputElement>;
type MultilineTextFieldProps = SharedTextFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export type TextFieldProps = SingleLineTextFieldProps | MultilineTextFieldProps;

export const TextField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(function TextField(
  { className, multiline = false, autoGrow = false, ...props },
  ref,
) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = React.useCallback(() => {
    if (!autoGrow || !textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [autoGrow]);

  React.useLayoutEffect(() => {
    resizeTextarea();
  }, [resizeTextarea, multiline, props.value]);

  if (multiline) {
    const textareaProps = props as React.TextareaHTMLAttributes<HTMLTextAreaElement>;
    const onInput = textareaProps.onInput;
    const handleInput: NonNullable<React.TextareaHTMLAttributes<HTMLTextAreaElement>['onInput']> = (event) => {
      resizeTextarea();
      onInput?.(event);
    };

    return (
      <textarea
        {...textareaProps}
        rows={textareaProps.rows ?? 2}
        ref={(element) => {
          textareaRef.current = element;
          setForwardedRef(ref as React.ForwardedRef<HTMLTextAreaElement>, element);
        }}
        className={joinClasses(styles.input, styles.inputMultiline, className)}
        onInput={handleInput}
      />
    );
  }

  return (
    <input
      {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
      ref={(element) => setForwardedRef(ref as React.ForwardedRef<HTMLInputElement>, element)}
      className={joinClasses(styles.input, className)}
    />
  );
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

const SHELF_LETTERS: ReadonlyArray<string> = (() => {
  const letters: string[] = [];
  const maxCode = MAX_SHELF_LETTER.charCodeAt(0);
  for (let code = 'A'.charCodeAt(0); code <= maxCode; code++) {
    letters.push(String.fromCharCode(code));
  }
  return letters;
})();

export interface ShelfSelectProps {
  id?: string;
  value: string;
  onChange: (letter: string) => void;
  className?: string;
}

export const ShelfSelect: React.FC<ShelfSelectProps> = ({ id, value, onChange, className }) => {
  return (
    <select
      id={id}
      className={joinClasses(styles.input, className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— select —</option>
      {SHELF_LETTERS.map((letter) => (
        <option key={letter} value={letter}>{letter}</option>
      ))}
    </select>
  );
};