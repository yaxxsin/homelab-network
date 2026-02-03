import { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

export default function Clock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format time for WIB timezone (UTC+7)
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <div className="clock-container">
            <ClockIcon size={16} className="clock-icon" />
            <span className="clock-time">{formatTime(time)} WIB</span>
        </div>
    );
}
