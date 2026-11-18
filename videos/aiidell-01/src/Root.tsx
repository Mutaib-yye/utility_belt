import React from 'react';
import {Composition} from 'remotion';
import {AiiDell01, FPS, TOTAL_SECONDS} from './AiiDell01';
import {AiiDellReel, REEL_SECONDS} from './AiiDellReel';
import {AiiDellReel2, REEL2_SECONDS} from './AiiDellReel2';

export const Root: React.FC = () => (
  <>
    <Composition id="AiiDellReel2" component={AiiDellReel2} durationInFrames={Math.round(REEL2_SECONDS * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="AiiDellReel" component={AiiDellReel} durationInFrames={Math.round(REEL_SECONDS * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="AiiDell01" component={AiiDell01} durationInFrames={Math.round(TOTAL_SECONDS * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
