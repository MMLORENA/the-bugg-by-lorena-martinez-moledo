import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import type { UserStructure } from "../../../database/models/User.js";
import User from "../../../database/models/User.js";
import httpStatusCodes from "../../../utils/httpStatusCodes.js";
import { loginUser, registerUser } from "./userControllers.js";
import CustomError from "../../../CustomError/CustomError.js";
import type { LoginCredentials } from "./types.js";

const {
  successCodes: { createdCode },
  clientErrors: { unauthorizedCode },
} = httpStatusCodes;

beforeEach(() => {
  jest.clearAllMocks();
});

const req: Partial<Request> = {};

const res: Partial<Response> = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};

const next = jest.fn();

describe("Given a registerUser Controller", () => {
  describe("When it receives a request with name 'user', password: 'user123', email: 'user@gmail.com'", () => {
    test("Then it should call the response method status with a 201", async () => {
      const registerBody: Partial<UserStructure> = {
        name: "user",
        password: "user123",
      };
      req.body = registerBody;
      const hashedPassword = "hashedpassword";
      const expectedStatus = createdCode;

      bcrypt.hash = jest.fn().mockResolvedValue(hashedPassword);

      User.create = jest.fn();

      await registerUser(req as Request, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(expectedStatus);
    });
  });

  describe("When it receives a request and there is an error", () => {
    test("Then it should call next with a custom Error", async () => {
      const error = new Error("");

      User.create = jest.fn().mockRejectedValue(error);
      await registerUser(req as Request, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

describe("Given a loginUser controller", () => {
  const incorrectCredentialsMessage = "Incorrect email or password";

  describe("When it receives a request with email 'luisito@isdicoders.com' and password 'luisito' and the user doesn't exist, and a next function", () => {
    test("Then next should be invoked with message 'User not found', status 401 and public message 'Incorrect email or password'", async () => {
      const luisitoCredentials: LoginCredentials = {
        email: "luisito@isdicoders.com",
        password: "luisito",
      };

      req.body = luisitoCredentials;

      User.findOne = jest.fn().mockResolvedValueOnce(null);

      const userNotFoundError = new CustomError(
        "User not found",
        unauthorizedCode,
        incorrectCredentialsMessage
      );

      await loginUser(req as Request, null, next);

      expect(next).toHaveBeenCalledWith(userNotFoundError);
    });
  });

  describe("When it receives a request with email 'luisito@isdicoders.com' and password 'luisito' and the password is incorrect, and a next function", () => {
    test("Then next should be invoked with message 'Incorrect password', status code 401 and public message 'Incorrect email or password'", async () => {
      const luisitoCredentials: LoginCredentials = {
        email: "luisito@isdicoders.com",
        password: "luisito",
      };

      req.body = luisitoCredentials;

      User.findOne = jest.fn().mockResolvedValueOnce(luisitoCredentials);
      bcrypt.compare = jest.fn().mockResolvedValueOnce(false);

      const incorrectPasswordError = new CustomError(
        "Incorrect password",
        unauthorizedCode,
        incorrectCredentialsMessage
      );

      await loginUser(req as Request, null, next);

      expect(next).toHaveBeenCalledWith(incorrectPasswordError);
    });
  });
});
