import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Tabs from './Tabs';
import { ITabItem } from '../models/ITabItem';

const tabs: ITabItem[] = [
  { key: 'one', headerText: 'One', content: <div>Panel One</div> },
  { key: 'two', headerText: 'Two', content: <div>Panel Two</div> },
  { key: 'three', headerText: 'Three', content: <div>Panel Three</div> },
];

describe('Tabs', () => {
  it('renders first tab as active when selectedKey is not provided', () => {
    render(<Tabs tabs={tabs} onTabClick={vi.fn()} />);

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel One')).toBeInTheDocument();
  });

  it('calls onTabClick when a tab is clicked', () => {
    const onTabClick = vi.fn();
    render(<Tabs tabs={tabs} selectedKey="one" onTabClick={onTabClick} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(onTabClick).toHaveBeenCalledWith('two');
  });

  it('supports arrow and home/end keyboard navigation', () => {
    const onTabClick = vi.fn();
    render(<Tabs tabs={tabs} selectedKey="one" onTabClick={onTabClick} />);

    const oneTab = screen.getByRole('tab', { name: 'One' });
    fireEvent.keyDown(oneTab, { key: 'ArrowRight' });
    expect(onTabClick).toHaveBeenCalledWith('two');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();

    fireEvent.keyDown(oneTab, { key: 'End' });
    expect(onTabClick).toHaveBeenCalledWith('three');

    const threeTab = screen.getByRole('tab', { name: 'Three' });
    fireEvent.keyDown(threeTab, { key: 'Home' });
    expect(onTabClick).toHaveBeenCalledWith('one');

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Two' }), { key: 'ArrowUp' });
    expect(onTabClick).toHaveBeenCalledWith('one');
  });

  it('handles key navigation safely when onTabClick is not provided', () => {
    render(<Tabs tabs={tabs} selectedKey="one" />);

    fireEvent.keyDown(screen.getByRole('tab', { name: 'One' }), { key: 'ArrowLeft' });
    expect(screen.getByText('Panel One')).toBeInTheDocument();
  });

  it('renders nothing when no tabs are provided', () => {
    const { container } = render(<Tabs tabs={[]} onTabClick={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('handles keyboard navigation safely when selectedKey does not match any tab', () => {
    render(<Tabs tabs={tabs} selectedKey="nonexistent" onTabClick={vi.fn()} />);

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel One')).toBeInTheDocument();
  });

  it('returns early when keyboard navigation lands on a missing tab entry', () => {
    const sparseTabs = new Array<ITabItem>(2);
    sparseTabs[0] = { key: 'one', headerText: 'One', content: <div>Panel One</div> };

    const onTabClick = vi.fn();
    render(<Tabs tabs={sparseTabs} selectedKey="one" onTabClick={onTabClick} />);

    fireEvent.keyDown(screen.getByRole('tab', { name: 'One' }), { key: 'ArrowRight' });

    expect(onTabClick).not.toHaveBeenCalled();
    expect(screen.getByText('Panel One')).toBeInTheDocument();
  });
});