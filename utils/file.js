import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import dbClient from './db';
import userUtils from './user';
import basicUtils from './basic';

/**
 * Module for handling file-related utilities
 */
const fileUtils = {
  /**
   * Validates the request body for creating a file
   * @param {object} request - Express request object
   * @return {object} - Object with error message and validated parameters
   */
  async validateBody(request) {
    const { name, type, isPublic = false, data, parentId = '0' } = request.body;

    const allowedTypes = ['file', 'image', 'folder'];
    let errorMsg = null;

    const normalizedParentId = parentId === '0' ? 0 : parentId;

    if (!name) {
      errorMsg = 'Missing name';
    } else if (!type || !allowedTypes.includes(type)) {
      errorMsg = 'Invalid type';
    } else if (type !== 'folder' && !data) {
      errorMsg = 'Missing data';
    } else if (normalizedParentId && normalizedParentId !== 0) {
      const parentFile = basicUtils.isValidId(normalizedParentId)
        ? await this.getFile({ _id: ObjectId(normalizedParentId) })
        : null;

      if (!parentFile) {
        errorMsg = 'Parent not found';
      } else if (parentFile.type !== 'folder') {
        errorMsg = 'Parent is not a folder';
      }
    }

    return {
      error: errorMsg,
      fileParams: { name, type, parentId: normalizedParentId, isPublic, data }
    };
  },

  /**
   * Retrieves a file document from the database
   * @param {object} query - Query to find the file
