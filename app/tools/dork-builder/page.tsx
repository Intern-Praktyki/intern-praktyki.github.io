import ToolShell from '@/components/ToolShell';
import DorkBuilder from './DorkBuilder';

export const metadata = {
  title: 'Google Dorking | Personal Hub',
  description: 'Zaawansowany budowniczy dork\'ów OSINT',
};

export default function DorkBuilderPage() {
  return (
    <ToolShell title="Google Dorking" accent="#ff8c00">
      <DorkBuilder />
    </ToolShell>
  );
}
