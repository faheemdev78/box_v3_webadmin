"use server";

import { getServerSessionToken } from "@/lib/auth/server";
import { getCurrentUser } from "@/lib/auth";

async function Dashboard() {
    const session = await getServerSessionToken();
    const user = await getCurrentUser(session);
    
    if (!user || !user._id) return <p>User not found!</p>
    
    return (<div>
        <h1>Dashboard</h1>

        {/* <pre>{JSON.stringify(user, 0, 2)}</pre>; */}

        <h1>Welcome, {user.name}</h1>
        <p>Account Type: {user.acc_type}</p>
        <p>Permissions: {user?.permissions}</p>

        <p>session: {session}</p>

        {/* {token || "No token found"} */}
        {/* <Nav token={token} /> */}
        {/* <h2>Welcome, {user?.name}</h2> */}
        {/* <p>Email: {user?.email}</p> */}
        {/* <button onClick={logout}>Logout</button> */}
    </div>);
}

export default Dashboard;
// export default withAuth(Dashboard);
