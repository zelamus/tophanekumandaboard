import { Composition } from 'remotion';
import { SimVideo } from './SimVideo';
import { FPS, TOTAL } from './timeline';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Simulasyon"
      component={SimVideo}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
