import React from 'react';
import ReactDOM from 'react-dom';
import Calendar from './Calendar';
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




class Board extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            notes: [],
            importedNotes: [],
            importedDbNotes: [],
        };
        this.recognition = new SpeechRecognition();
        this.recognition.interimResults = true;
        this.importFromDbDate = this.importFromDbDate.bind(this);
    }

    handleRecognition() {
        const notes = this.state.notes;
        this.recognition.addEventListener('end', this.recognition.start);
        this.recognition.addEventListener('result', e => {
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
        console.log(this.state.importedNotes);

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
                console.log(result);
                this.setState({ importedDbNotes: result });
            });
    }

    handleMonthSelection(month, year) {
        console.log(month, year);
    }


    removeNote(notex) {
        console.log(notex);
    }


    startRec() {
        this.recognition.start();
    }

    stopRec() {
        this.recognition.stop();
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
            const noteId = note._id;
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
                <button onClick={() => this.saveStorage()}> Save notes to storage </button>
                <button onClick={() => this.importStorage()}> Import notes from storage </button>
                <button onClick={() => this.removeStorage()}> Remove storage </button>
                <button onClick={() => this.saveToDb()}> Save notes to DB </button>

                <button onClick={() => this.startRec()}>Start REC</button>
                <button onClick={() => this.stopRec()}>STOP REC</button>

                <div id="day-notes">
                    <Calendar onClick={(datePicked) => this.importFromDbDate(datePicked)} handleDaySelection={this.importFromDbDate} handleMonthSelection={this.handleMonthSelection} />
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