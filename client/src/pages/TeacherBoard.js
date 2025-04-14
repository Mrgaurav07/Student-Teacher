import { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import { DragDropContext } from "react-beautiful-dnd";
import { UserContext } from "../contexts/UserContext";
import TeacherBoardColumn from "../components/TeacherBoardColumn";

const background = require("../style/assets/images/teacher-board-background-80.png");
const calendarIcon = require("../style/assets/icons/calendar_icon.png");

const TeacherBoard = () => {
  const { userState } = useContext(UserContext);
  const [boardState, setBoardState] = useState({ columns: {}, columnOrder: [] });
  const [forceRefreshTeacherBoard, setForceRefreshTeacherBoard] = useState(false);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.data) {
          setBoardState(data.data || { columns: {}, tasks: {}, columnOrder: [] });
        } else {
          console.error("Unexpected data format:", data);
        }
      })
      .catch((err) => console.error("Fetch error:", err));
  }, [forceRefreshTeacherBoard]);

  const onDragStart = () => {
    // Optional: document.body.style.color = "purple";
  };

  const onDragUpdate = (update) => {
    const { destination } = update;
    const opacity = destination ? destination.index / (Object.keys(boardState.tasks || {}).length || 1) : 0;
    document.body.style.backgroundColor = `rgba(153, 141, 217, ${opacity})`;
    document.body.style.transition = "background-color 0.2s ease";
  };

  const onDragEnd = (result) => {
    document.body.style.color = "black";
    document.body.style.backgroundColor = "white";

    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = boardState.columns[source.droppableId];
    const finish = boardState.columns[destination.droppableId];

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...start, taskIds: newTaskIds };

      const newBoardState = {
        ...boardState,
        columns: { ...boardState.columns, [start.id]: newColumn }
      };
      setBoardState(newBoardState);
      return;
    }

    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...start, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, taskIds: finishTaskIds };

    const newBoardState = {
      ...boardState,
      columns: { ...boardState.columns, [newStart.id]: newStart, [newFinish.id]: newFinish }
    };
    setBoardState(newBoardState);

    fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBoardState)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 400 || data.status === 500) {
          window.alert(data.error);
          window.location.reload();
        }
      })
      .catch((err) => console.error("Fetch error:", err));
  };

  if (!boardState.columnOrder.length) return <div>Loading...</div>;

  return (
    <Wrapper>
      <Calendar>
        <Title>
          <img src={calendarIcon} alt="Calendar Icon" />
          <h2>Click on the day's title to add a task</h2>
        </Title>
        <DragDropContext onDragStart={onDragStart} onDragUpdate={onDragUpdate} onDragEnd={onDragEnd}>
          <Container>
            {boardState.columnOrder.map((columnId) => (
              <TeacherBoardColumn
                key={columnId}
                columnName={columnId}
                boardState={boardState}
                setBoardState={setBoardState}
                forceRefreshTeacherBoard={forceRefreshTeacherBoard}
                setForceRefreshTeacherBoard={setForceRefreshTeacherBoard}
              />
            ))}
          </Container>
        </DragDropContext>
      </Calendar>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 4vh 0;
  background: #ddeaff;
  background-size: cover;
  background-repeat: no-repeat;
  height: 100%;
`;

const Calendar = styled.div`
  background: #ffffff;
  padding: 30px;
  border-radius: 15px;
  width: 90%;

  h2 {
    color: #51565d;
    font-weight: 600;
    font-size: 30px;
    font-family: Arial, Helvetica, sans-serif;
    text-align: center;
  }
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  img {
    height: 50px;
    width: auto;
  }
`;

const Container = styled.div`
  display: flex;
  justify-content: space-evenly;
  margin-right: 30px;
  padding: 20px;
  margin-bottom: 0;
`;

export default TeacherBoard;
