// src/pages/AdminPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get("http://192.168.219.74:3000/users");
    setUsers(res.data);
  };

  const handleRoleChange = async (id, newRole) => {
    await axios.put(`http://192.168.219.74:3000/users/${id}`, { role: newRole });
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await axios.delete(`http://192.168.219.74:3000/users/${id}`);
    fetchUsers();
  };

  const filtered = users.filter((u) => u.email.includes(search) || u.nickname.includes(search));

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">관리자 페이지</h2>
      <input
        type="text"
        placeholder="유저 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-2 py-1 mb-3 w-64"
      />
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th>ID</th><th>이메일</th><th>닉네임</th><th>역할</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => (
            <tr key={u.id} className="border-t">
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.nickname}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="border px-1"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  <option value="super_admin">super_admin</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleDelete(u.id)} className="bg-red-500 text-white px-2 py-1 rounded">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPage;
