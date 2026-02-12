"use client"
import { useState, useRef, useEffect, useCallback } from 'react'

export default function Home() {
  // State for rendering
  const [process, setProcess] = useState(0)
  const [angle, setAngle] = useState(0)
  
  // Voice-over mode states
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false)
  const [message, setMessage] = useState('')
  
  // Refs for physics calculation (avoid re-renders)
  const processRef = useRef(0)
  const angleRef = useRef(0)
  const isDraggingRef = useRef(false)
  const lastYRef = useRef(0)
  
  // Voice-over mode refs
  const triggerCountRef = useRef(0)
  const isHandlingTriggerRef = useRef(false)
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([])
  
  // Gravity effect multiplier
  const radio = 0.5

  // Clear all pending timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach(id => clearTimeout(id))
    timeoutIdsRef.current = []
  }, [])

  // Handle voice-over trigger when process reaches 80%
  const handleVoiceoverTrigger = useCallback(() => {
    if (isHandlingTriggerRef.current) return
    
    triggerCountRef.current += 1
    const count = triggerCountRef.current
    
    if (count === 1) {
      // First trigger
      isHandlingTriggerRef.current = true
      
      // Immediately correct to -60 degrees
      angleRef.current = -60
      setAngle(-60)
      
      setMessage("hey! dont touch my paper!")
      
      const t1 = setTimeout(() => {
        setMessage("I mean progressbar!")
      }, 1000)
      
      const t2 = setTimeout(() => {
        setMessage("that's much better")
      }, 3000)
      
      const t3 = setTimeout(() => {
        setMessage('')
        isHandlingTriggerRef.current = false
      }, 5000)
      
      timeoutIdsRef.current.push(t1, t2, t3)
      
    } else if (count === 2) {
      // Second trigger
      isHandlingTriggerRef.current = true
      
      // Immediately correct to -60 degrees
      angleRef.current = -60
      setAngle(-60)
      
      setMessage("stop already!")
      
      const t1 = setTimeout(() => {
        setMessage("hands up, dont touch anything else")
      }, 1500)
      
      const t2 = setTimeout(() => {
        setMessage('')
        isHandlingTriggerRef.current = false
      }, 4000)
      
      timeoutIdsRef.current.push(t1, t2)
      
    } else if (count === 3) {
      // Third trigger - don't correct, just show message
      setMessage("you just never give up, do you")
      
      const t1 = setTimeout(() => {
        setMessage('')
      }, 3000)
      
      timeoutIdsRef.current.push(t1)
    }
    // After third trigger, no more responses
  }, [])

  // Handle voice-over toggle
  const handleVoiceoverToggle = useCallback((enabled: boolean) => {
    setVoiceoverEnabled(enabled)
    clearAllTimeouts()
    
    if (enabled) {
      // Initialize voice-over mode: liquid at 20%, angle at -60 degrees (draining)
      processRef.current = 20
      setProcess(20)
      angleRef.current = -20
      setAngle(-20)
      triggerCountRef.current = 0
      isHandlingTriggerRef.current = false
      setMessage('')
    } else {
      // Reset to normal state
      processRef.current = 0
      setProcess(0)
      angleRef.current = 0
      setAngle(0)
      triggerCountRef.current = 0
      isHandlingTriggerRef.current = false
      setMessage('')
    }
  }, [clearAllTimeouts])

  // Physics simulation loop
  useEffect(() => {
    let animationId: number
    
    const updatePhysics = () => {
      // Only apply gravity when angle is significant
      if (Math.abs(angleRef.current) > 1) {
        // Calculate gravity effect based on current angle
        const gravityEffect = Math.sin(angleRef.current * (Math.PI / 180)) * radio
        // Clamp process value between 0 and 100
        const newProcess = Math.max(0, Math.min(100, processRef.current + gravityEffect))
        processRef.current = newProcess
        setProcess(Math.floor(newProcess))
        
        // Check for voice-over trigger (process reaches 80%)
        if (voiceoverEnabled && newProcess >= 80 && triggerCountRef.current < 3) {
          handleVoiceoverTrigger()
        }
      }
      animationId = requestAnimationFrame(updatePhysics)
    }
    
    animationId = requestAnimationFrame(updatePhysics)
    // Cleanup on unmount
    return () => cancelAnimationFrame(animationId)
  }, [voiceoverEnabled, handleVoiceoverTrigger])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => clearAllTimeouts()
  }, [clearAllTimeouts])

  // Start dragging - record initial Y position
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true
    lastYRef.current = e.clientY
    e.preventDefault()
  }, [])

  // Handle rotation while dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const deltaY = e.clientY - lastYRef.current
      // Clamp angle between -90 and 90 degrees
      const newAngle = Math.max(-90, Math.min(90, angleRef.current + deltaY * radio))
      angleRef.current = newAngle
      setAngle(newAngle)
      lastYRef.current = e.clientY
    }
  }, [])

  // Stop dragging
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  return (
    <>
      {/* Controls */}
      <div className="controls">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={voiceoverEnabled}
            onChange={(e) => handleVoiceoverToggle(e.target.checked)}
          />
          with Voice-over behavior
        </label>
      </div>

      {/* Message display */}
      {message && <div className="message">{message}</div>}

      {/* Progress bar */}
      <div
        className="process-bar"
        style={{ '--process': `${process}%`, '--angle': `${angle}deg` } as React.CSSProperties}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="liquid" />
        <div className="fill">
          <span>{process}%</span>
          <span> Loading</span>
        </div>
      </div>
    </>
  )
}
