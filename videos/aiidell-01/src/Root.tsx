import React from 'react';
import {Composition} from 'remotion';
import {AiiDell01, FPS, TOTAL_SECONDS} from './AiiDell01';
import {AiiDellReel, REEL_SECONDS} from './AiiDellReel';

export const Root: React.FC = () => (
  <>
    <Composition id="AiiDellReel" component={AiiDellReel} durationInFrames={Math.round(REEL_SECONDS * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="AiiDell01" component={AiiDell01} durationInFrames={Math.round(TOTAL_SECONDS * FPS)} fps={FPS} width={1080} height={1920} />
  </>
);
