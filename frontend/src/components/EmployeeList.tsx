import React from 'react';
import { Employee } from '../types/Employee';
import './EmployeeList.css';

interface EmployeeListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: number) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onEdit, onDelete }) => {
  if (employees.length === 0) {
    return (
      <div className="empty-state">
        <p>No employees found. Add your first employee!</p>
      </div>
    );
  }

  return (
    <div className="employee-list">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Position</th>
            <th>Department</th>
            <th>Salary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.name}</td>
              <td>{employee.email}</td>
              <td>{employee.position}</td>
              <td>{employee.department}</td>
              <td>{employee.salary ? `$${employee.salary.toLocaleString()}` : 'N/A'}</td>
              <td>
                <button
                  className="btn-edit"
                  onClick={() => onEdit(employee)}
                >
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => employee.id && onDelete(employee.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeList;

