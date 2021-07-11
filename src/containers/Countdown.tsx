import { useState } from 'react';
import Countdown from 'react-countdown';

export default () => {
  const [date, setDate] = useState<any>(Date.now() + 43200000)
  const renderer = ({ hours, minutes, seconds, completed }: any ) => {
      // Render a countdown
      return <span>{hours}:{minutes}:{seconds}</span>;
  };

  return (
    <Countdown date={date} renderer={renderer} />
  ); 
};