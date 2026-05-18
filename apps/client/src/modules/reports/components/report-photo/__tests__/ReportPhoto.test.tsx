import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportPhoto } from '../ReportPhoto.js';

describe('ReportPhoto', () => {
  it('renders a designed placeholder (not a blank) when there is no photo', () => {
    render(
      <ReportPhoto
        reportId="r1"
        photoKey={null}
        alt="Rex"
        variant="detail"
      />,
    );
    expect(screen.getByText('No photo yet')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Rex — no photo yet/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Rex' })).not.toBeInTheDocument();
  });

  it('renders an <img> pointing at the public photo endpoint when present', () => {
    render(
      <ReportPhoto
        reportId="r1"
        photoKey="k1"
        alt="Rex"
        variant="card"
      />,
    );
    const img = screen.getByRole('img', { name: 'Rex' });
    expect(img).toHaveAttribute(
      'src',
      expect.stringContaining('/reports/r1/photo'),
    );
  });
});
