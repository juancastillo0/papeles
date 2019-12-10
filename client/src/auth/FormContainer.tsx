import styled from "styled-components";

export const InputDiv = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .input-div {
    display: flex;
    flex: 2;
    @media (max-width: 560px) {
      flex-direction: column;
      label {
        margin-bottom: 2px;
      }
    }
    input {
      padding: 10px 15px;
      font-size: inherit;
      &.error {
        background: #fff2f2;
      }
    }
    label {
      display: flex;
      flex: 2;
      margin-right: 20px;
      align-items: center;
      @media (min-width: 560px) {
        justify-content: flex-end;
      }
    }
  }
`;

export const FormContainer = styled.div`
  align-self: center;
  width: 100%;
  display: flex;
  background: ${p => p.theme.colors.primaryLight};
  justify-content: center;

  @media (min-width: ${p => p.theme.breakpoint.sm}) {
    max-width: 600px;
    padding: 0 40px 40px;
    border-radius: 0 0 15px 15px;
    box-shadow: 0 2px 5px 1px ${p => p.theme.colors.auxLight};
  }

  form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 115%;
    padding: 0 20px 40px;
    @media (min-width: ${p => p.theme.breakpoint.sm}) {
      padding: 0 40px 40px;
    }
    h1 {
      margin-block-end: 1em;
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
    footer {
      text-align: center;
    }

    #button-div {
      width: 100%;
      display: flex;
      justify-content: flex-end;
      button {
        padding: 12px 17px;
        font-size: inherit;
        border-radius: ${p => p.theme.borderRadius};
        background: ${p => p.theme.colors.secondary};
        color: white;
        border: 0;
        :hover {
          box-shadow: 0 1px 1px 1px ${p => p.theme.colors.auxLight};
        }
        :focus {
          outline: 0;
        }
      }
    }
  }
`;
