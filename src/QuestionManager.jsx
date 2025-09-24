import { useEffect, useState } from 'react'
import { db } from './firebase/config'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'

export default function QuestionManager() {
  const [questions, setQuestions] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    level: 1,
    order: 1,
    text: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    backgroundImg: '',
    slideUrl: '',
  })

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'questions'), (snap) => {
      const questionList = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      // Sort by level first, then by order
      questionList.sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level
        }
        return (a.order || 1) - (b.order || 1)
      })
      setQuestions(questionList)
    })
    return () => unsub()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('option')) {
      const idx = Number(name.replace('option', ''))
      setForm((f) => ({
        ...f,
        options: f.options.map((o, i) => (i === idx ? value : o)),
      }))
    } else if (
      name === 'level' ||
      name === 'order' ||
      name === 'correctIndex'
    ) {
      setForm((f) => ({ ...f, [name]: Number(value) }))
    } else {
      setForm((f) => ({ ...f, [name]: value }))
    }
  }

  const handleEdit = (q) => {
    setEditing(q.id)
    setForm({
      level: q.level,
      order: q.order || 1,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      backgroundImg: q.backgroundImg,
      slideUrl: q.slideUrl || '',
    })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this question?')) {
      await deleteDoc(doc(db, 'questions', id))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.options.some((o) => !o)) return alert('All options required')
    if (!form.text) return alert('Question text required')
    let submitForm = { ...form }
    if (!editing) {
      // Auto assign order
      const levelQuestions = questions.filter((q) => q.level === form.level)
      const maxOrder =
        levelQuestions.length > 0
          ? Math.max(...levelQuestions.map((q) => q.order || 1))
          : 0
      submitForm.order = maxOrder + 1
    }
    if (editing) {
      await updateDoc(doc(db, 'questions', editing), submitForm)
    } else {
      await addDoc(collection(db, 'questions'), submitForm)
    }
    setEditing(null)
    setForm({
      level: 1,
      order: 1,
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      backgroundImg: '',
      slideUrl: '',
    })
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>Question Manager</h2>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#232323',
          color: '#fff',
          borderRadius: 10,
          padding: 18,
          marginBottom: 32,
        }}
      >
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <label>Level: </label>
            <input
              type='number'
              name='level'
              min={1}
              max={4}
              value={form.level}
              onChange={handleChange}
              style={{ width: 60 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Question: </label>
            <input
              type='text'
              name='text'
              value={form.text}
              onChange={handleChange}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ margin: '16px 0', display: 'flex', gap: 12 }}>
          {form.options.map((opt, i) => (
            <div key={i}>
              <label>Option {i + 1}: </label>
              <input
                type='text'
                name={`option${i}`}
                value={opt}
                onChange={handleChange}
                style={{ width: 120 }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <label>Correct: </label>
            <select
              name='correctIndex'
              value={form.correctIndex}
              onChange={handleChange}
            >
              {[0, 1, 2, 3].map((i) => (
                <option key={i} value={i}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Background Img: </label>
            <input
              type='text'
              name='backgroundImg'
              value={form.backgroundImg}
              onChange={handleChange}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Slide URL: </label>
            <input
              type='text'
              name='slideUrl'
              value={form.slideUrl}
              onChange={handleChange}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <button
          type='submit'
          style={{
            marginTop: 18,
            background: '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: 5,
            padding: '8px 24px',
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          {editing ? 'Update' : 'Add'} Question
        </button>
        {editing && (
          <button
            type='button'
            onClick={() => {
              setEditing(null)
              setForm({
                level: 1,
                order: 1,
                text: '',
                options: ['', '', '', ''],
                correctIndex: 0,
                backgroundImg: '',
              })
            }}
            style={{
              marginLeft: 12,
              background: '#888',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              padding: '8px 24px',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </form>
      <h3>All Questions</h3>
      <table
        style={{
          width: '100%',
          background: '#232323',
          color: '#fff',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <thead>
          <tr style={{ background: '#333' }}>
            <th>Level</th>
            <th>Order</th>
            <th>Text</th>
            <th>Options</th>
            <th>Correct</th>
            <th>BG Img</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <td>{q.level}</td>
              <td>{q.order || 1}</td>
              <td>{q.text}</td>
              <td>{q.options.join(', ')}</td>
              <td>{Number(q.correctIndex) + 1}</td>
              <td>
                <a
                  href={q.backgroundImg}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  BG
                </a>
              </td>
              <td>
                <button
                  onClick={() => handleEdit(q)}
                  style={{
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 5,
                    padding: '4px 10px',
                    marginRight: 6,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  style={{
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 5,
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
