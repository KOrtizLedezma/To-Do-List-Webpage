import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';

const Dates = ({ pickedDate, setPickedDate, showAllTasksOnDate, userId}) => {
    const [date, setDate] = useState(new Date());
    const formattedDate = format(date, 'MM/dd/yyyy');

    const handleDateChange = async(newDate) => {
        setDate(newDate);
        setPickedDate(format(newDate, 'MM/dd/yyyy'));
        showAllTasksOnDate(format(newDate, 'MM/dd/yyyy'), userId);
    };

    return (
        <main className="main_calendar">
            <div className="dates">
                <div className="calendar_centered">
                    <Calendar onChange={handleDateChange} value={date} showNeighboringMonth={true}/>
                </div>
            </div>
        </main>
    );
};

export default Dates;
