import { fireEvent, screen } from '@testing-library/react';

export const clickGenerateLabels = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));
};

export const setTextboxValues = (values: Record<number, string>): void => {
  const inputs = screen.getAllByRole('textbox');
  Object.entries(values).forEach(([index, value]) => {
    fireEvent.change(inputs[Number(index)], { target: { value } });
  });
};

export const setComboboxValue = (name: string, value: string): void => {
  fireEvent.change(screen.getByRole('combobox', { name }), { target: { value } });
};

export const setInputByPlaceholder = (placeholder: string, value: string): void => {
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
};
