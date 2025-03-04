/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const CypherService = require("../services/cypherService");
const sessionService = require("../services/sessionService");
const GraphCreator = require("../models/GraphCreator");

class CypherController {
    async executeCypher(req, res) {
        let connectorService = sessionService.get(req.sessionID);
        if (connectorService.isConnected()) {
            let cypherService = new CypherService(
                connectorService.graphRepository
            );
            let data = await cypherService.executeCypher(req.body.cmd);
            res.status(200).json(data).end();
        } else {
            throw new Error("Not connected");
        }
    }

    async createGraph(req, res, next) {
        let db = sessionService.get(req.sessionID);
        if (db.isConnected()){
            let [client, transaction] = await db.graphRepository.createTransaction();
            try {
                let graph = new GraphCreator({
                    nodes: req.files.nodes || [],
                    edges: req.files.edges || [],
                    graphName: req.body.graphName,
                    dropGraph: req.body.dropGraph === 'true'
                });
                
                await graph.parseData();
                const DROP = graph.query.graph.drop;
                const CREATE = graph.query.graph.create;
                if (DROP){
                    try{
                       await client.query(DROP);
                    }catch(e){
                        if(e.code !== '3F000') throw e;
                    }
                    
                }
                await client.query(CREATE);
                await transaction('BEGIN');
                await Promise.all(graph.query.labels.map(async (q)=>{
                    return await transaction(q);
                }));
                await Promise.all(graph.query.nodes.map(async (q)=>{
                    return await transaction(q);
                }));
                await Promise.all(graph.query.edges.map(async (q)=>{
                    return await transaction(q);
                }));
                await transaction('COMMIT');
                res.status(204).end();
            } catch (e){
                await transaction('ROLLBACK');
                const details = e.toString();
                const err = {
                    ...e,
                    details
                }
                res.status(500).json(err).end();
            }finally{
                client.release();
            }

        }
    }
}

module.exports = CypherController;
