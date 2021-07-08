import Countdown from 'react-countdown';

export default () => {
  const renderer = ({ hours, minutes, seconds, completed }: any ) => {
      // Render a countdown
      return <span>{hours}:{minutes}:{seconds}</span>;
  };

  return (
    <Countdown date={Date.now() + 43200000} renderer={renderer} />
  ); 
};