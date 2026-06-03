"use client"

function TextInput({name, id, value, setValue, placeholder, type, required}) {
    return (
        <>
            <div className="col-sm-6">
                <div className="form-floating form-floating-outline">
                    <input type={type} id={id} value={value} onChange={setValue} className="form-control" placeholder={placeholder} />
                    <label htmlFor={id}>{name} {required && <span className="text-danger">*</span>} </label>
                </div>
            </div>
        </>
    )
}

export default TextInput