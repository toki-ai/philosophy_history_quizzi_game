import { useEffect, useState } from 'react'
import { db } from './firebase/config'
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  getDocs,
  deleteDoc,
} from 'firebase/firestore'

import RoomDetail from './RoomDetail'
import QuestionManager from './QuestionManager'

function AdminDashboard({ adminId }) {
  const [rooms, setRooms] = useState([])
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [activeTab, setActiveTab] = useState('rooms')

  useEffect(() => {
    if (!adminId) return
    const q = query(collection(db, 'games'), where('adminId', '==', adminId))
    const unsub = onSnapshot(q, async (snap) => {
      const data = await Promise.all(
        snap.docs.map(async (d) => {
          // Count players (fix for modular SDK)
          const playersSnap = await getDocs(collection(d.ref, 'players'))
          return {
            id: d.id,
            ...d.data(),
            playerCount: playersSnap.size,
          }
        })
      )
      console.log('Rooms:', data)
      setRooms(data)
    })
    return () => unsub()
  }, [adminId])

  const handleAction = async (roomId, action) => {
    const roomRef = doc(db, 'games', roomId)
    if (action === 'start')
      await updateDoc(roomRef, {
        status: 'in-progress',
        questionStarted: 'waiting',
      })
    if (action === 'end') await updateDoc(roomRef, { status: 'ended' })
    if (action === 'off') await updateDoc(roomRef, { status: 'off' })
    if (action === 'delete') {
      if (window.confirm('Delete this room?')) {
        // Delete players first
        const playersSnap = await getDocs(collection(roomRef, 'players'))
        playersSnap.docs.forEach(async (p) => {
          await deleteDoc(p.ref)
        })
        await deleteDoc(roomRef)
      }
    }
  }

  const handleCreateRoom = async () => {
    setShowDialog(true)
    setNewCode('')
    setDialogError('')
  }

  const handleDialogCreate = async () => {
    setDialogError('')
    if (!/^[0-9]{5}$/.test(newCode)) {
      setDialogError('Code phải gồm 5 chữ số!')
      return
    }
    setCreating(true)
    try {
      // Check code unique
      const q = query(collection(db, 'games'), where('code', '==', newCode))
      const snap = await getDocs(q)
      if (!snap.empty) {
        setDialogError('Code đã tồn tại, chọn code khác!')
        setCreating(false)
        return
      }
      await addDoc(collection(db, 'games'), {
        code: newCode,
        status: 'waiting',
        currentQ: 0,
        questionStarted: 'waiting',
        level: 1,
        submittedCount: 0,
        adminId,
        createdAt: serverTimestamp(),
      })
      // Admin không cần thêm vào players collection
      setShowDialog(false)
      setNewCode('')
    } catch (e) {
      setDialogError('Lỗi: ' + e.message)
    }
    setCreating(false)
  }

  if (selectedRoomId) {
    return (
      <RoomDetail
        roomId={selectedRoomId}
        onBack={() => setSelectedRoomId(null)}
      />
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 32 }}>Admin Dashboard</h2>
      <div
        style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}
      >
        <button
          onClick={() => setActiveTab('rooms')}
          style={{
            background: activeTab === 'rooms' ? '#4caf50' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 5,
            padding: '10px 20px',
            marginRight: 10,
            cursor: 'pointer',
          }}
        >
          Rooms
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          style={{
            background: activeTab === 'questions' ? '#4caf50' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 5,
            padding: '10px 20px',
            cursor: 'pointer',
          }}
        >
          Questions
        </button>
      </div>
      {activeTab === 'rooms' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <button
              onClick={handleCreateRoom}
              disabled={creating}
              style={{
                background: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: 5,
                padding: '10px 28px',
                fontWeight: 600,
                fontSize: 17,
                cursor: creating ? 'not-allowed' : 'pointer',
              }}
            >
              {creating ? 'Creating...' : 'Create Room'}
            </button>
            {showDialog && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: '#000a',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    background: '#232323',
                    color: '#fff',
                    borderRadius: 10,
                    padding: 32,
                    minWidth: 320,
                    boxShadow: '0 2px 12px #0008',
                    position: 'relative',
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>Tạo phòng mới</h3>
                  <label>Nhập mã phòng (5 số):</label>
                  <input
                    type='text'
                    value={newCode}
                    onChange={(e) =>
                      setNewCode(e.target.value.replace(/\D/g, '').slice(0, 5))
                    }
                    style={{
                      width: '100%',
                      padding: 8,
                      margin: '12px 0',
                      fontSize: 18,
                      letterSpacing: 2,
                    }}
                    autoFocus
                    maxLength={5}
                  />
                  {dialogError && (
                    <div style={{ color: 'red', marginBottom: 8 }}>
                      {dialogError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button
                      onClick={handleDialogCreate}
                      disabled={creating}
                      style={{
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 5,
                        padding: '8px 24px',
                        fontWeight: 600,
                        fontSize: 16,
                        cursor: creating ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Tạo
                    </button>
                    <button
                      onClick={() => {
                        setShowDialog(false)
                        setNewCode('')
                        setDialogError('')
                      }}
                      style={{
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
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 24,
              justifyContent: 'center',
            }}
          >
            {rooms.length === 0 ? (
              <div>No rooms found.</div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    background: '#232323',
                    color: '#fff',
                    borderRadius: 12,
                    padding: 24,
                    minWidth: 260,
                    boxShadow: '0 2px 12px #0004',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}
                  >
                    Room Code: {room.code}
                  </div>
                  <div>
                    Status: <b>{room.status}</b>
                  </div>
                  <div>
                    Players: <b>{room.playerCount}</b>
                  </div>
                  <div>
                    Created:{' '}
                    {room.createdAt?.toDate
                      ? room.createdAt.toDate().toLocaleString()
                      : ''}
                  </div>
                  <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => handleAction(room.id, 'start')}
                      style={{
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 5,
                        padding: '6px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      Start
                    </button>
                    <button
                      onClick={() => handleAction(room.id, 'end')}
                      style={{
                        background: '#f39c12',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 5,
                        padding: '6px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      End
                    </button>
                    <button
                      onClick={() => handleAction(room.id, 'off')}
                      style={{
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 5,
                        padding: '6px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => handleAction(room.id, 'delete')}
                      style={{
                        background: '#8b0000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 5,
                        padding: '6px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedRoomId(room.id)}
                    style={{
                      position: 'absolute',
                      right: 16,
                      bottom: 16,
                      background: '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 5,
                      padding: '6px 14px',
                      cursor: 'pointer',
                      marginTop: 12,
                    }}
                  >
                    View Detail
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
      {activeTab === 'questions' && <QuestionManager />}
    </div>
  )
}
export default AdminDashboard
