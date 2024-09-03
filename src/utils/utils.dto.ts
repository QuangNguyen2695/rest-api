class TimeStampFB {
    seconds: number;
    nanoseconds: number;

    toDate() {
        return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
    }

    toString() {
        return `TimeStampFB(seconds=${this.seconds}, nanoseconds=${this.nanoseconds})`;
    }
}