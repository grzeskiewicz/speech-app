import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';


const API_URL = 'http://localhost:3005/';

const headers = new Headers({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
});


function request(url, method, dataset, headerz) {
    return new Request(url, {
        method: method,
        headers: headers,
        mode: 'cors',
        body: JSON.stringify(dataset)
    });
}




const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.interimResults = true;
recognition.start();




class PreviousMonth extends React.Component {
    render() {
        return (
            <span id="previous" onClick = {(nextClicked) => this.props.onClick(nextClicked)}> &lt;&lt; </span>
        )
    }
}


class NextMonth extends React.Component {
    render() {
        return (
            <span id="next" onClick = {(nextClicked) => this.props.onClick(nextClicked)}> &gt;&gt; </span>
        )
    }
}


class Calendar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            yearNow: new Date().getFullYear(),
            selectedMonth: new Date().getMonth(),
            showNext: false
        };

    }

    createCalendar(year, month) {
        const results = [];

        // find out first and last days of the month
        const firstDate = new Date(year, month, 1); //first day of the month
        const lastDate = new Date(year, month + 1, 0); //last day of month
        // calculate first monday and last sunday
        const firstMonday = this.getFirstMonday(firstDate);
        const lastSunday = this.getLastSunday(lastDate);

        // iterate days starting from first monday
        let iterator = new Date(firstMonday);
        let i = 0;

        // ..until last sunday
        while (iterator <= lastSunday) {
            if (i++ % 7 === 0) {
                // start new week when monday
                var week = [];
                results.push(week);
            }
            // push day to week
            week.push({
                date: new Date(iterator),
                before: iterator < firstDate, // add indicator if before current month
                after: iterator > lastDate // add indicator if after current month
            });
            // iterate to next day
            iterator.setDate(iterator.getDate() + 1);
        }
        return results;
    }

    fixMonday(day) {
        day || (day = 7);
        return --day;
    }

    getFirstMonday(firstDate) { //first monday closest to 1st day of mondth
        const offset = this.fixMonday(firstDate.getDay()); //how many days from 1st to monday

        const result = new Date(firstDate);
        result.setDate(firstDate.getDate() - offset); //create first monday : 1st day of the month - offset
        return result;
    }

    getLastSunday(lastDate) {
        const offset = 6 - this.fixMonday(lastDate.getDay()); //how many days till monday (6-dayOfTheWeek -1)

        const result = new Date(lastDate);
        result.setDate(lastDate.getDate() + offset); //last possible sunday after last day of the month

        return result;
    }


    changeMonth(nextClicked) {
        const monthNow = new Date().getMonth();
        let showNext = this.state.showNext;
        let selectedMonth = this.state.selectedMonth;
        nextClicked ? selectedMonth++ : selectedMonth--;

        showNext = (selectedMonth < monthNow) ? true : false;

        this.setState({
            selectedMonth: selectedMonth,
            showNext: showNext,
        })
    }


    render() {
        const today = new Date();
        const calendar = this.createCalendar(this.state.yearNow, this.state.selectedMonth);
        const DAY_NAMES = 'Mo Tu We Th Fr Sa Su'.split(' ');
        const MONTH_NAMES = 'January February March April May June July August September October November December'.split(' ');


        const daysOfTheWeek = DAY_NAMES.map((day, index) => {
            return (
                <td key={index}>{day}</td>
            );
        });


        const weeksToRender = [];
        for (let j = 0; j < calendar.length; j++) {
            const week = calendar[j];

            const weekMap = week.map((day, index) => {
                let classes = '';
                if (day.date.getMonth() === today.getMonth() && day.date.getDate() === today.getDate()) classes = classes.concat('today ');
                if (day.date.getDate() > today.getDate() && day.date.getMonth() === today.getMonth()) classes = classes.concat('not-selectable ');
                if (day.date.getMonth() > today.getMonth()) classes = classes.concat('not-selectable ');
                if (day.before) classes = classes.concat('before ');
                if (day.after) classes = classes.concat('after ');

                return (
                    <td data-date={day.date} key={index} className={classes} onClick={()=>this.props.onClick(day.date)}>{day.date.getDate()}</td>
                );
            });
            weeksToRender.push(weekMap);

        }

        const month = weeksToRender.map((week, index) => {
            return (
                <tr key={index}>{week}</tr>
            );
        });


        return (
            <div>
            <div id="month-control">
             <PreviousMonth onClick={() => this.changeMonth(false)} />  
             {MONTH_NAMES[this.state.selectedMonth]} 
             {this.state.showNext ? <NextMonth onClick={() => this.changeMonth(true)} /> : null } 
             </div>
                <table>
                    <thead><tr>{daysOfTheWeek}</tr></thead>
                    <tbody>{month}</tbody>
                </table>
            </div>
        )
    }
}

class Board extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            notes: [],
            importedNotes: [],
            importedDbNotes: [],
        };

    }
    handleRecognition() {
        const notes = this.state.notes;
        recognition.addEventListener('end', recognition.start);
        recognition.addEventListener('result', e => {
            const transcript = Array.from(e.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            const temp = transcript;
            if (e.results[0].isFinal) {
                this.setState({
                    notes: notes.concat(temp)
                });
            }

        });

    }

    importStorage() {
        const importedNotes = (window.localStorage.getItem('notes')) === null ? 'No notes in the storage' : window.localStorage.getItem('notes');
        //console.log(importedNotes);
        this.setState({
            importedNotes: importedNotes.split(',')
        });
        //console.log(importedNotes);

    }

    removeStorage() {
        window.localStorage.removeItem('notes');
    }

    saveStorage() {
        window.localStorage.setItem('notes', this.state.notes);
    }


    saveToDb() {
        console.log(this.state.importedNotes);
        console.log(this.state.notes);
        const notes = { content: JSON.stringify(this.state.notes.concat(this.state.importedNotes)) };
        fetch(request(API_URL + "savenotes", 'POST', notes))
            .then(res => res.json())
            .then(result => {
                console.log(result);
            });
    }

    importFromDb() {
        fetch(request(API_URL + "getnotes", 'GET'))
            .then(res => res.json())
            .then(result => {
                this.setState({ importedDbNotes: result });
            });
    }


    importFromDbDate(datePicked) {
        console.log(datePicked);
        const date = { date: datePicked }
        fetch(request(API_URL + "getnotesdate", 'POST', date))
            .then(res => res.json())
            .then(result => {
                //console.log(result);
                this.setState({ importedDbNotes: result });
            });
    }

    removeNote(notex){
        console.log(notex);
    }

    render() {
        this.handleRecognition();
        const notes = this.state.notes.map((note, index) => {
            return (
                <li key={index}>{note}</li>
            );
        });

        const imported = String(this.state.importedNotes).split(',').map((note, index) => {
            return (
                <li key={index}>{note}</li>
            );
        });
        const importedDbNotes = this.state.importedDbNotes.map((note, index) => {
            const noteId=note._id;
console.log(noteId);
            return (
                <li key={index}><span className="note"><div className="content">{note.content}</div><div className="remove-note" onClick={(n) => this.removeNote(n)}>[X]</div></span></li>
            );
        });


        return (
            <div>
            <ol>{notes}</ol>
            <p>Imported notes:</p>
            <ol>{imported}</ol>
             <button onClick = {() => this.saveStorage()}> Save notes to storage </button>
            <button onClick = {() => this.importStorage()}> Import notes from storage </button>
<button onClick = {() => this.removeStorage()}> Remove storage </button>
<button onClick = {() => this.saveToDb()}> Save notes to DB </button>
<div id="day-notes">
<Calendar onClick={(datePicked) => this.importFromDbDate(datePicked)}/>
<div>
<ol>
    {importedDbNotes}
</ol>
</div>
</div>
            </div>


        );
    }

    /*  return (); */
}




// ========================================

ReactDOM.render(
    <Board />,
    document.getElementById('root')
);