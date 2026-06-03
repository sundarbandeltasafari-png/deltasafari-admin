"use client"
import React, { useEffect, useRef, useState } from 'react'

function SearchList({ handleSearch, placeholder }) {
    const [searchData, setSearchData] = useState('');
    const timeoutRef = useRef();

    function handleInput(event) {
        const value = event.target.value;
        setSearchData(value);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            handleSearch(value);
        }, 500);
    }

    useEffect(() => {
        return ()=>{
            if(timeoutRef.current){
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return (
        <>
            <div className='d-flex gap-3'>
                <div className="dt-search">
                    <input type="search" onInput={handleInput} className="form-control form-control-sm" id="dt-search-0" placeholder={placeholder} aria-controls="DataTables_Table_0" />
                    <label htmlFor="dt-search-0"></label>
                </div>
                <div className='d-flex align-items-center justify-content-center'>
                    <button className="btn add-new btn-primary" tabIndex="0" aria-controls="DataTables_Table_0" type="button" onClick={handleSearch}>
                        <span>
                            <i className="icon-base ri ri-search-line icon-sm me-0 me-sm-2"></i>
                            <span className="d-none d-sm-inline-block">Search</span>
                        </span>
                    </button>
                </div>
            </div>
        </>
    )
}

export default SearchList