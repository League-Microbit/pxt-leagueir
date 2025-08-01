namespace irtest {


    /* Classify a pulse base on the 1st and 99th percentile
   * breaks from data collected by pulsetimes.py
   *                     Lower   Upper
   *     1 BIT_MARK        420     860
   *     2 HEADER_MARK     8800    9200
   *     3 HEADER_SPACE    4300    4600
   *     4 ONE_SPACE       1100    1900
   */
    export function classifyPulse(pulse: number): number {
        if (pulse >= 420 && pulse <= 860) return 3;  // BIT_MARK
        if (pulse >= 1100 && pulse <= 1900) return 4; // ONE_SPACE
        if (pulse >= 4300 && pulse <= 4600) return 2; // HEADER_SPACE
        if (pulse >= 8800 && pulse <= 9200) return 1; // HEADER_MARK
        
        return 0; // Unknown
    }

    /** Create a code from the edge times
     * Read the code by 2 at a time. The first two must be [1,2]
     * The next 64 must be [3,4] for a 1 bit, or [3,3] for a 0 bit. The last one must be 3.
     *
     */
    export function createCodeFromEdgeTimes(edgeTimes: number[]): number {


        let code = 0
        // Convert from little-endian to big-endian (reverse byte order)
        code = ((code & 0xFF) << 24) |
            ((code & 0xFF00) << 8) |
            ((code & 0xFF0000) >> 8) |
            ((code & 0xFF000000) >>> 24);

        return code;
    }


    

}