const response = await fetch("./scrapping/prayer_times.json");
const data = await response.json();

const prayerOrder = [
    "fajr",
    "shuruq",
    "dhuhr",
    "asr",
    "maghrib",
    "isha"
];

function getDatePrayers(date = new Date()) {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return data.prayers[month][day];
}

function getPrayerMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function getNextPrayer(data) {
    const now = new Date();
    const prayersToday = getDatePrayers(now);

    const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

    for (const name of prayerOrder) {
        const prayer = prayersToday[name];

        if (!prayer) continue;

        const prayerMinutes = getPrayerMinutes(prayer.time);

        if (prayerMinutes > currentMinutes) {
            return {
                name,
                ...prayer,
                tomorrow: false
            };
        }
    }

    // Isha est passée → prochaine prière = Fajr demain
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const prayersTomorrow = getDatePrayers(tomorrow);

    return {
        name: "fajr",
        ...prayersTomorrow.fajr,
        tomorrow: true
    };
}

function displayPrayers(data) {
    const now = new Date();

    const prayersToday = getDatePrayers(now);

    const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

    const ishaMinutes = getPrayerMinutes(prayersToday.isha.time);

    let prayersToDisplay = prayersToday;

    // Si Isha est passée, on affiche demain
    if (currentMinutes >= ishaMinutes) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        prayersToDisplay = getDatePrayers(tomorrow);
    }

    const prayersContainer = document.querySelector("#prayers");
    const prayersEl = document.querySelectorAll("#prayers div");
    const nextPrayer = getNextPrayer(data)

    prayersEl.forEach((element, index) => {

        element.classList.remove("active");

        const name = element.classList[0];
        const prayer = prayersToDisplay[name];

        if (!prayer) return;

        if (name === nextPrayer.name) {
            element.classList.add("active");

            const columns = Array(prayersEl.length).fill("auto");
            columns[index] = "1fr";

            prayersContainer.style.gridTemplateColumns =
                columns.join(" ");
        }

        element.querySelector("p:nth-of-type(1)").textContent =
            prayer.time;

        element.querySelector("p:nth-of-type(2)").textContent =
            prayer.iqama_offset;
    });
}

displayPrayers(data);
console.log(getNextPrayer(data));