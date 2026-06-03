"use client"

import { useState } from "react"

function PasswordInput({name, id, value, setValue, placeholder, required}) {
    const [visible, setVisible] = useState(false)
    return (
        <>
            <div className="col-sm-6 form-password-toggle">
                <div className="input-group input-group-merge">
                    <div className="form-floating form-floating-outline">
                        <input type={visible ? "text" : "password"} id={id} value={value} onChange={setValue} min={0} max={9999999999} className="form-control" placeholder={placeholder} aria-describedby={id+"_error"} />
                        <label htmlFor={id}>{name} {required && <span className="text-danger">*</span>}</label>
                    </div>
                    <span className="input-group-text cursor-pointer" id={id+"_error"} onClick={()=>{setVisible(!visible)}}><i className={`icon-base ri ri-eye${!visible ? "-off" : ''}-line icon-20px`}></i></span>
                </div>
            </div>
        </>
    )
}

export default PasswordInput