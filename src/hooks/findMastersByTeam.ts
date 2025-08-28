import { useEffect, useState } from 'react'

const mapTeamToQuery = (team:string) => {
    switch (team) {
        case 'A': return 'TEAM1';
        case 'B': return 'TEAM2';
        case 'C': return 'TEAM3';
        case 'W': return 'TEAM11';

        default: return "TEAM1";
    }
};

export const useMastersByTeam = (team:string) => {
    const [masters, setMasters] = useState([]);

    useEffect(() => {
        if (!team) return;

        const queryTeam = mapTeamToQuery(team);
        fetch(`https://bot-crm-backend-756832582185.us-central1.run.app/api/masters?team=${queryTeam}`)
            .then((res) => (res.ok ? res.json() : []))
            .then(setMasters)
            .catch(() => setMasters([]));
    }, [team]);
    return masters;
};
