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
            importedNotes: importedNotes
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
        const notes = { content: JSON.stringify(this.state.notes) };
        // const notes = { 'content': "Hehehehxxxxx" };
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
        const date= {date: datePicked }
        fetch(request(API_URL + "getnotesdate", 'POST', date))
            .then(res => res.json())
            .then(result => {
                this.setState({ importedDbNotes: result });
            });
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

        return (
            <div>
            <ol>{notes}</ol>
            <p>Imported notes:</p>
            <ol>{imported}</ol>
             <button onClick = {() => this.saveStorage()}> Save notes to storage </button>
            <button onClick = {() => this.importStorage()}> Import notes from storage </button>
<button onClick = {() => this.removeStorage()}> Remove storage </button>

<button onClick = {() => this.saveToDb()}> Save notes to DB </button>
<button onClick = {() => this.importFromDb()}> Import notes from DB </button>
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