import "./StudentList.css";
import type { Student } from "../../constants/Interfaces";
import StudentCard from "./_StudentCard";

interface StudentListProps {
    list: Student[];
}

const StudentList: React.FC<StudentListProps> = ({ list }) => {
    return (
        <div className="student-list">
            {list.map((student:Student) => (
                <StudentCard
                    key={student.id}
                    id={student.id}
                    name={student.name}
                />
            ))}
        </div>
    );
}

export default StudentList;