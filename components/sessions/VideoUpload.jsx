'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, File, X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function VideoUpload({ onUpload, loading, disabled }) {
    const [file, setFile] = useState(null)
    const [dragging, setDragging] = useState(false)
    const [progress, setProgress] = useState(0)
    const [uploaded, setUploaded] = useState(false)
    const inputRef = useRef(null)

    const handleFile = (selectedFile) => {
        if (!selectedFile) return
        if (!selectedFile.type.startsWith('video/')) {
            alert('Please select a video file')
            return
        }
        setFile(selectedFile)
        setUploaded(false)
        setProgress(0)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        const dropped = e.dataTransfer.files[0]
        handleFile(dropped)
    }

    const handleUpload = async () => {
        if (!file || !onUpload) return
        try {
            await onUpload(file, (pct) => setProgress(pct))
            setUploaded(true)
        } catch {
            setProgress(0)
        }
    }

    const handleRemove = () => {
        setFile(null)
        setProgress(0)
        setUploaded(false)
        if (inputRef.current) inputRef.current.value = ''
    }

    const formatFileSize = (bytes) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            {!file && (
                <div
                    className={cn(
                        'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                        dragging
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                    )}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <Upload className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                    <p className="text-white font-medium text-sm">
                        Drop your video here
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                        or click to browse — MP4, MOV, AVI supported
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files[0])}
                    />
                </div>
            )}

            {/* File preview */}
            {file && (
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700 shrink-0">
                            {uploaded
                                ? <CheckCircle2 className="h-5 w-5 text-green-400" />
                                : <File className="h-5 w-5 text-slate-400" />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                {file.name}
                            </p>
                            <p className="text-slate-500 text-xs">
                                {formatFileSize(file.size)}
                            </p>
                        </div>
                        {!loading && !uploaded && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-red-400 p-1"
                                onClick={handleRemove}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Progress */}
                    {progress > 0 && progress < 100 && (
                        <div className="mt-3">
                            <Progress value={progress} className="h-1.5 bg-slate-700" />
                            <p className="text-slate-500 text-xs mt-1">{progress}% uploaded</p>
                        </div>
                    )}

                    {uploaded && (
                        <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Upload complete
                        </p>
                    )}
                </div>
            )}

            {/* Upload button */}
            {file && !uploaded && (
                <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleUpload}
                    disabled={loading || disabled}
                >
                    {loading ? 'Uploading...' : 'Upload Video'}
                </Button>
            )}
        </div>
    )
}