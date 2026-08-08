import type { ReactNode } from 'react';
import * as styles from '@/styles/common/layout/SectionCard.css';

interface Props {
  title: string;
  children: ReactNode;
}

/** Titled card surface used to group a screen's settings into sections. */
export function SectionCard({ title, children }: Props) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      {children}
    </section>
  );
}
