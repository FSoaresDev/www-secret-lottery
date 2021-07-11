import { useState } from 'react';
import Countdown from 'react-countdown';
import { IRound } from '../api/getRounds';

export default ({currentRoundsState}: {currentRoundsState: IRound}) => {
  const [date, setDate] = useState<any>(Date.now() + 43200000)
  const renderer = ({ hours, minutes, seconds, completed }: any ) => {
      // Render a countdown
      return <span>{hours}:{minutes}:{seconds}</span>;
  };

  return (
    <div>
      Round expected to End at {currentRoundsState.round_expected_end_block} Block
    </div>
    //<Countdown date={date} renderer={renderer} />
  ); 
};