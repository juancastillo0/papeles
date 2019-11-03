import styled from "styled-components";

export default styled.form`
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 120%;
  padding: 0 40px 40px;
  border-radius: 0 0 15px 15px;
  @media (max-width: 550px) {
    padding: 0 25px;
  }
  h1 {
    margin-block-end: 1em;
  }
  section {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    @media (max-width: 560px) {
      flex-direction: column;
    }
    label {
      display: flex;
      flex: 2;
      margin-bottom: 10px;
      margin-right: 20px;
      align-items: center;
      @media (min-width: 560px) {
        justify-content: flex-end;
      }
    }
    .input-div {
      display: flex;
      flex-direction: column;
      flex: 2;
      input {
        padding: 10px 15px;
        font-size: inherit;
      }
    }
  }

  div.error {
    color: red;
    text-align: center;
    font-size: 0.9em;
  }
  button.anchor {
    font-size: inherit;
    background: transparent;
    border: 0;
    color: blue;
    text-decoration: underline;

    :hover,
    :focus {
      color: rgba(9, 69, 215, 1);
      outline: 0;
    }
  }

  #button-div {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    button {
      padding: 12px 17px;
      font-size: inherit;
      border-radius: 7px;
      background: #1460df;
      color: white;
      border: 0;
      :hover {
        box-shadow: 0 1px 1px 1px var(--aux-color);
      }
      :focus {
        outline: 0;
      }
    }
  }
`;
