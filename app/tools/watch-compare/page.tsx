import ToolShell from '@/components/ToolShell';
import WatchCompare from './WatchCompare';

export const metadata = {
  title: 'Porównywarka Zegarków | Personal Hub',
  description: 'Analiza zakupu vintage Cartier — Must Tank, Santos, Pasha C',
};

export default function WatchComparePage() {
  return (
    <ToolShell title="Porównywarka Zegarków" accent="#3d72c9">
      <WatchCompare />
    </ToolShell>
  );
}
