import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TourCard from './TourCard';

// Next.js Link 모킹
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('TourCard', () => {
  const mockItem = {
    tAtsNm: '경복궁',
    areaCd: '1',
    tAtsCd: '12345',
  };

  it('renders tour name correctly', () => {
    render(<TourCard item={mockItem} />);
    expect(screen.getByText('경복궁')).toBeInTheDocument();
  });

  it('renders area code correctly', () => {
    render(<TourCard item={mockItem} />);
    expect(screen.getByText('지역 코드: 1')).toBeInTheDocument();
  });

  it('renders as a link with correct href', () => {
    render(<TourCard item={mockItem} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tour/12345');
  });

  it('uses areaCd as fallback when tAtsCd is not provided', () => {
    const itemWithoutTatsCd = {
      tAtsNm: '테스트 여행지',
      areaCd: '2',
    };
    
    render(<TourCard item={itemWithoutTatsCd} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tour/2');
  });

  it('applies correct CSS classes', () => {
    render(<TourCard item={mockItem} />);
    const card = screen.getByRole('link').firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow', 'p-4');
  });
}); 