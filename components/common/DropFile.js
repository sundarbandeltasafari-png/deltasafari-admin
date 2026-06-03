"use client"
import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function DropFile({ onDrop, selectedPic, deleteFile }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 })

    return (
        <div {...getRootProps()}>
            <div className="dropzone needsclick dz-clickable" id="dropzone-basic">
                {selectedPic ?
                    <div className="dz-preview dz-file-preview">
                        <div className="dz-details">
                            <div className="dz-thumbnail">
                                <img src={selectedPic} />
                                <span className="dz-nopreview">No preview</span>
                            </div>
                            <div className='d-flex align-items-center p-2'>
                                <span className='singleline'>file. akjdkljaslkj asodjlksajkldjdjsa askljdlksajlkdjkla dsalkjdklsaj</span>
                                <div className="btn btn-sm btn-danger" onClick={deleteFile}><i className="ri ri-delete-bin-line"></i></div>
                            </div>
                        </div>
                    </div> :
                    <>
                        <div className="dz-message needsclick">
                            <input {...getInputProps()} />
                            {
                                isDragActive ?
                                    <span>Drop the files here ...</span> :
                                    <span>Drag & drop files here, or click to select files</span>
                            }
                            <span className="note needsclick">(This is dropzone. Selected files to upload)</span>
                        </div>
                    </>}
            </div>
        </div>
    )
}