"use client";
import React, { useEffect } from 'react';

export default function PermisionWrapper({ children }) {
    useEffect(() => {
        // Global listener to open calendar picker on clicking anywhere on full date/time input box
        const handleGlobalDateClick = (e) => {
            const target = e.target;
            if (
                target && 
                target.tagName === 'INPUT' && 
                (target.type === 'date' || target.type === 'datetime-local' || target.type === 'month' || target.type === 'time')
            ) {
                try {
                    if (typeof target.showPicker === 'function') {
                        target.showPicker();
                    }
                } catch (err) {
                    // Ignore if picker already triggered or browser restriction
                }
            }
        };

        document.addEventListener('click', handleGlobalDateClick, { capture: true });
        return () => {
            document.removeEventListener('click', handleGlobalDateClick, { capture: true });
        };
    }, []);

    return <>{children}</>;
}